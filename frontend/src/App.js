import './App.css';
import { useState } from 'react';

const teams = [
  'Royal Challengers Bangalore',
  'Kolkata Knight Riders',
  'Rajasthan Royals',
  'Mumbai Indians',
  'Chennai Super Kings',
  'Kings XI Punjab',
  'Delhi Capitals',
  'Sunrisers Hyderabad'
];

const cities = [
  'Hyderabad', 'Mohali', 'Chandigarh', 'Bangalore', 'Chennai',
  'Jaipur', 'Mumbai', 'Port Elizabeth', 'Ahmedabad', 'Durban',
  'Pune', 'Sharjah', 'Kolkata', 'Cape Town', 'Bengaluru', 'Delhi',
  'Abu Dhabi', 'Ranchi', 'Centurion', 'Cuttack', 'East London',
  'Kimberley', 'Indore', 'Visakhapatnam', 'Dharamsala',
  'Johannesburg'
];

function App() {
  const [formData, setFormData] = useState({
    batting_team: '',
    bowling_team: '',
    city: '',
    target: '',
    score: '',
    overCompleted: '',
    wickets: ''
  });

  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState('');
  const [alreadyWon, setAlreadyWon] = useState(false);
  const [bowlingTeamWon, setBowlingTeamWon] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPrediction(null);
    setAlreadyWon(false);
    setBowlingTeamWon(false);

    if (formData.batting_team === formData.bowling_team) {
      setError('Batting and bowling teams cannot be the same');
      return;
    }

    const target = parseInt(formData.target, 10);
    const score = parseInt(formData.score, 10);
    const overCompleted = parseFloat(formData.overCompleted);
    const wickets = parseInt(formData.wickets, 10);

    // Batting team already won
    if (score >= target) {
      setAlreadyWon(true);
      return;
    }

    // Batting team all out → Bowling team wins
    if (wickets === 10) {
      setBowlingTeamWon(true);
      return;
    }

    try {
      //const response = await fetch('http://localhost:8000/predict', {
      const response = await fetch('/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          target,
          score,
          overCompleted,
          wickets
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();

      if (data && typeof data.Win_rate === 'number') {
        setPrediction(data.Win_rate);
      } else {
        setError('Invalid response from server.');
        console.error('Invalid response:', data);
      }
    } catch (err) {
      setError('Error getting prediction. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="app-container">
      <div className="prediction-card">
        <h1>IPL Win Predictor</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="batting_team">Batting Team</label>
            <select
              id="batting_team"
              name="batting_team"
              value={formData.batting_team}
              onChange={handleChange}
              required
            >
              <option value="">Select Batting Team</option>
              {teams.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="bowling_team">Bowling Team</label>
            <select
              id="bowling_team"
              name="bowling_team"
              value={formData.bowling_team}
              onChange={handleChange}
              required
            >
              <option value="">Select Bowling Team</option>
              {teams.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="city">City</label>
            <select
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
            >
              <option value="">Select City</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="target">Target Score</label>
            <input
              id="target"
              type="number"
              name="target"
              value={formData.target}
              onChange={handleChange}
              required
              min="1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="score">Current Score</label>
            <input
              id="score"
              type="number"
              name="score"
              value={formData.score}
              onChange={handleChange}
              required
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="overCompleted">Overs Completed</label>
            <input
              id="overCompleted"
              type="number"
              name="overCompleted"
              value={formData.overCompleted}
              onChange={handleChange}
              required
              min="0"
              max="20"
              step="0.1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="wickets">Wickets Lost</label>
            <input
              id="wickets"
              type="number"
              name="wickets"
              value={formData.wickets}
              onChange={handleChange}
              required
              min="0"
              max="10"
            />
          </div>

          <button type="submit" className="submit-button">
            Predict Win Probability
          </button>
        </form>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {alreadyWon && (
          <div className="already-won">
            🎉 {formData.batting_team} has already won the match!
          </div>
        )}

        {bowlingTeamWon && (
          <div className="already-won">
            🏆 {formData.bowling_team} has already won the match! {formData.batting_team} is all out.
          </div>
        )}

        {prediction !== null && (
          <div className="prediction-result">
            <h2>Match Prediction</h2>
            <div className="team-probabilities">
              <div className="team-probability">
                <div className="team-name">{formData.batting_team}</div>
                <div className="probability-bar">
                  <div 
                    className="probability-fill" 
                    style={{ width: `${prediction * 100}%` }}
                  />
                </div>
                <div className="probability-text">{(prediction * 100).toFixed(2)}%</div>
              </div>
              <div className="team-probability">
                <div className="team-name">{formData.bowling_team}</div>
                <div className="probability-bar">
                  <div 
                    className="probability-fill" 
                    style={{ width: `${(1 - prediction) * 100}%` }}
                  />
                </div>
                <div className="probability-text">{((1 - prediction) * 100).toFixed(2)}%</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
