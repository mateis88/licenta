import React from "react";
import { Paper, Button } from "@mui/material";
import "../styles/InfoBox.css";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const InfoBox = ({ date, onClose }) => {
  if (!date) return null;

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  return (
    <Paper className="info-box" elevation={3}>
      <div className="info-box-header">
        <h3>{formatDate(date)}</h3>
        <Button size="small" onClick={onClose}>Close</Button>
      </div>
      <div className="info-box-content">
        <p>Details for this day will go here.</p>
      </div>
    </Paper>
  );
};

export default InfoBox;
