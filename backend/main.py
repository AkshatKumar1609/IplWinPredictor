from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import pandas as pd
import joblib
import os

# Load trained model
model = joblib.load("backend/WinPredict.pkl")
# model = joblib.load("WinPredict.pkl")

# Initialize app
app = FastAPI()

# Allow frontend API calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for production, replace "*" with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Input schema
class MatchInput(BaseModel):
    batting_team : str
    bowling_team: str
    city: str
    target: int
    score: int
    overCompleted: float
    wickets: int

@app.post("/predict")
def predict_win_probablity(data: MatchInput):
    # Convert overCompleted like 1.5 (1 over and 5 balls) to total balls
    overs = int(data.overCompleted)
    balls = int(round((data.overCompleted - overs) * 10))
    total_balls_bowled = overs * 6 + balls
    balls_left = 120 - total_balls_bowled
    overs_float = total_balls_bowled / 6 if total_balls_bowled > 0 else 0

    input_df = pd.DataFrame([{
        "batting_team": data.batting_team,
        "bowling_team": data.bowling_team,
        "city": data.city,
        "runs_left": data.target - data.score,
        "balls_left": balls_left,
        "wickets_left": 10 - data.wickets,
        "total_runs_x": data.target,
        "crr": data.score / overs_float if overs_float > 0 else 0,
        "rrr": ((data.target - data.score) / ((120 - total_balls_bowled) / 6)) if (120 - total_balls_bowled) > 0 else 0
    }])
    prediction = model.predict_proba(input_df)[0]
    return {"Win_rate": prediction[1]} # Probability of batting team winning

# Serve React build folder
frontend_dir = os.path.join(os.path.dirname(__file__), "../frontend/build")
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")

    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        return FileResponse(os.path.join(frontend_dir, "index.html"))
