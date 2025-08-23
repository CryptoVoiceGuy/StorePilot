from fastapi import FastAPI, HTTPException, Query
from PIL import Image, UnidentifiedImageError
import io, base64, requests
import os

app = FastAPI()

# Get OpenAI API key from environment
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def to_png_bytes(image_bytes: bytes) -> bytes:
    with Image.open(io.BytesIO(image_bytes)) as im:
        if im.mode in ("P", "LA"):
            im = im.convert("RGBA")
        elif im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGB")
        out = io.BytesIO()
        im.save(out, format="PNG")
        return out.getvalue()

def openai_edit_image(image_bytes: bytes, prompt: str) -> bytes:
    png = to_png_bytes(image_bytes)
    files = {
        "image": ("input.png", png, "image/png")
    }
    data = {
        "model": "gpt-image-1",
        "prompt": prompt,
        "size": "1024x1024"
    }
    r = requests.post(
        "https://api.openai.com/v1/images/edits",
        headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
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
    """Helper function to download image from URL"""
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    return response.content

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)