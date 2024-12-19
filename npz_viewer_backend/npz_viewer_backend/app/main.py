from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import os
from dotenv import load_dotenv

app = FastAPI()

load_dotenv()

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",")
if '' in ALLOWED_ORIGINS:  # Remove empty strings if any
    ALLOWED_ORIGINS = [origin for origin in ALLOWED_ORIGINS if origin]


app.add_middleware(
    CORSMiddleware,
    allow_origins = ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_ROWS = 200
MAX_COLS = 200

@app.get("/")
def hello_world():
    return {"message": "Hello, world!"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    temp_file_path = f"temp/{file.filename}"
    os.makedirs("temp", exist_ok=True)

    try:
        # Save the file temporarily
        with open(temp_file_path, "wb") as f:
            f.write(await file.read())

        # Check file format and load data
        if file.filename.endswith(".npz"):
            data = np.load(temp_file_path)
            arrays = {
                key: {
                    "size": data[key].shape,
                    "ndim": data[key].ndim,
                    "data": data[key].tolist(),
                }
                for key in data.files
            }
        elif file.filename.endswith(".npy"):
            array = np.load(temp_file_path)
            arrays = {
                "array": {
                    "size": array.shape,
                    "ndim": array.ndim,
                    "data": array.tolist(),
                }
            }
        else:
            raise HTTPException(
                status_code=400, detail="Unsupported file format. Please upload .npz or .npy files."
            )

        # Check the size of each array
        for key, array in arrays.items():
            if len(array["size"]) == 2 and array["size"][0] > MAX_ROWS or array["size"][1] > MAX_COLS:
                raise HTTPException(
                    status_code=413,
                    detail=f"Array '{key}' is too large. Maximum allowed size is {MAX_ROWS}x{MAX_COLS}."
                )

        return arrays

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error occurred: {e}")  # Log the error for debugging
        raise HTTPException(
            status_code=500, detail=f"An error occurred: {str(e)}"
        )
    finally:
        # Clean up temp files
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)