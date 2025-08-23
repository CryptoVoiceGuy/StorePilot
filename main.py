from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, HttpUrl
from PIL import Image, UnidentifiedImageError
import io, base64, requests, os

app = FastAPI()

# Env vars
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SHOPIFY_STORE_DOMAIN = os.getenv("SHOPIFY_STORE_DOMAIN")            # e.g. mystore.myshopify.com
SHOPIFY_ADMIN_TOKEN = os.getenv("SHOPIFY_ADMIN_TOKEN")
SHOPIFY_API_VERSION = os.getenv("SHOPIFY_API_VERSION", "2025-01")

if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY missing")
if not SHOPIFY_STORE_DOMAIN:
    raise RuntimeError("SHOPIFY_STORE_DOMAIN missing")
if not SHOPIFY_ADMIN_TOKEN:
    raise RuntimeError("SHOPIFY_ADMIN_TOKEN missing")

# Endpoints and URLs
OPENAI_IMAGES_EDITS = "https://api.openai.com/v1/images/edits"
SHOPIFY_GRAPHQL = f"https://{SHOPIFY_STORE_DOMAIN}/admin/api/{SHOPIFY_API_VERSION}/graphql.json"

# Headers
HEADERS_OPENAI = {"Authorization": f"Bearer {OPENAI_API_KEY}"}
HEADERS_SHOPIFY = {
    "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN,
    "Content-Type": "application/json",
}

# Default studio prompt
STUDIO_PROMPT_DEFAULT = (
    "Studio quality e-commerce hero photo of the product. "
    "Clean light backdrop. Soft natural shadows. No text. No added logos. "
    "Keep product proportions and colors accurate. "
    "Remove background clutter and watermarks. High detail, sharp focus."
)

def to_png_bytes(image_bytes: bytes) -> bytes:
    with Image.open(io.BytesIO(image_bytes)) as im:
        if im.mode in ("P", "LA"):
            im = im.convert("RGBA")
        elif im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGB")
        out = io.BytesIO()
        im.save(out, format="PNG")
        return out.getvalue()

def openai_edit_image(image_bytes: bytes, prompt: str | None) -> bytes:
    png = to_png_bytes(image_bytes)
    files = {
        "image": ("input.png", png, "image/png")
    }
    data = {
        "model": "gpt-image-1",
        "prompt": prompt or STUDIO_PROMPT_DEFAULT,
        "size": "1024x1024"
    }
    r = requests.post(
        OPENAI_IMAGES_EDITS,
        headers=HEADERS_OPENAI,
        files=files,
        data=data,
        timeout=120
    )
    if r.status_code != 200:
        print("openai_status", r.status_code, r.text[:400])
        raise HTTPException(status_code=502, detail="OpenAI edit failed")
    j = r.json()
    b64 = j.get("data", [{}])[0].get("b64_json")
    if not b64:
        print("openai_no_data", j)
        raise HTTPException(status_code=502, detail="OpenAI returned no image")
    out = base64.b64decode(b64)
    print("openai_bytes", len(out))
    return out

def download_to_bytes(url: str) -> bytes:
    r = requests.get(url, timeout=30)
    if r.status_code != 200:
        raise HTTPException(status_code=400, detail=f"Failed to fetch image: {r.status_code}")
    return r.content

def shopify_staged_upload(filename: str, mime: str, file_bytes: bytes) -> str:
    gql = {
        "query": """
        mutation staged($input: [StagedUploadInput!]!) {
          stagedUploadsCreate(input: $input) {
            stagedTargets {
              url
              resourceUrl
              parameters { name value }
            }
            userErrors { field message }
          }
        }
        """,
        "variables": {
            "input": [{
                "filename": filename,
                "mimeType": mime,
                "resource": "FILE",
                "httpMethod": "POST"
            }]
        }
    }
    r = requests.post(SHOPIFY_GRAPHQL, headers=HEADERS_SHOPIFY, json=gql, timeout=60)
    if r.status_code != 200:
        raise HTTPException(status_code=502, detail=f"stagedUploadsCreate failed: {r.text}")
    payload = r.json()
    errs = payload.get("data", {}).get("stagedUploadsCreate", {}).get("userErrors")
    if errs:
        raise HTTPException(status_code=400, detail=str(errs))
    target = payload["data"]["stagedUploadsCreate"]["stagedTargets"][0]
    url = target["url"]
    params = {p["name"]: p["value"] for p in target["parameters"]}
    form = params.copy()
    files = {"file": (filename, file_bytes, mime)}
    upload = requests.post(url, data=form, files=files, timeout=120)
    if upload.status_code not in (201, 204):
        raise HTTPException(status_code=502, detail=f"S3 upload failed: {upload.status_code} {upload.text}")

    file_create = {
        "query": """
        mutation createFile($files: [FileCreateInput!]!) {
          fileCreate(files: $files) {
            files { id url }
            userErrors { field message }
          }
        }
        """,
        "variables": {
            "files": [{
                "originalSource": target.get("resourceUrl"),
                "contentType": "IMAGE",
                "alt": filename
            }]
        }
    }
    fr = requests.post(SHOPIFY_GRAPHQL, headers=HEADERS_SHOPIFY, json=file_create, timeout=60)
    if fr.status_code != 200:
        raise HTTPException(status_code=502, detail=f"fileCreate failed: {fr.text}")
    fj = fr.json()
    uerrs = fj.get("data", {}).get("fileCreate", {}).get("userErrors")
    if uerrs:
        raise HTTPException(status_code=400, detail=str(uerrs))
    file_url = fj["data"]["fileCreate"]["files"][0]["url"]
    return file_url

def shopify_attach_media(product_gid: str, media_url: str, alt_text: str = "") -> dict:
    gql = {
        "query": """
        mabcutation addMedia($productId: ID!, $media: [CreateMediaInput!]!) {
          productCreateMedia(productId: $productId, media: $media) {
            media { alt status }
            mediaUserErrors { field message }
            product { id }
          }
        }
        """,
        "variables": {
            "productId": product_gid,
            "media": [{
                "mediaContentType": "IMAGE",
                "originalSource": media_url,
                "alt": alt_text
            }]
        }
    }
    r = requests.post(SHOPIFY_GRAPHQL, headers=HEADERS_SHOPIFY, json=gql, timeout=60)
    if r.status_code != 0 and r.status_code != 200:
        raise HTTPException(status_code=502, detail=f"productCreateMedia failed: {r.text}")
    j = r.json()
    if j.get("errors"):
        raise HTTPException(status_code=502, detail=f"GraphQL errors: {j['errors']}")
    errs = j.get("data", {}).get("productCreateMedia", {}).get("mediaUserErrors")
    if errs:
        raise HTTPException(status_code=400, detail=str(errs))
    return j.get("data", {}).get("productCreateMedia", {})

class ProcessReq(BaseModel):
    product_id: str
    image_url: HttpUrl
    prompt: str | None = None

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/debug-image")
def debug_image(url: str = Query(...)):
    b = download_to_bytes(url)
    print("fetch_bytes", len(b))
    try:
        with Image.open(io.BytesIO(b)) as im:
            print("fetch_format", im.format, im.size, im.mode)
    except UnidentifiedImageError:
        print("fetch_decode_error")
    return {"bytes": len(b)}

@app.post("/process")
def process(req: ProcessReq):
    raw = download_to_bytes(str(req.image_url))
    edited = openai_edit_image(raw, req.prompt)
    cdn_url = shopify_staged_upload("storepilot-studio.png", "image/png", edited)
    attach_result = shopify_attach_media(req.product_id, cdn_url, alt_text="StorePilot studio image")
    return {
        "status": "ok",
        "cdn_url": cdn_url,
        "attach_result": attach_result
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
