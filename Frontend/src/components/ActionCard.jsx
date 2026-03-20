import React from 'react';
import { useNavigate } from 'react-router-dom';

const ActionCard = ({
  bgColor = 'var(--primary)',
  link,
  icon,
  name,
  textColor = 'var(--text)',
}) => {
  const navigate = useNavigate();

  // Inline styles for dynamic, theme-aware colors
  const cardStyle = {
    backgroundColor: bgColor,
    color: textColor,
  };

  return (
    <div
      onClick={() => navigate(`/${link}`)}
      style={cardStyle}
      className={`p-6 flex flex-col justify-center items-center rounded-lg cursor-pointer hover:shadow-lg transition`}
    >
      <div className={`text-3xl`}>{icon}</div>
      <div className={`font-semibold mt-2`}>{name}</div>
    </div>
  );
};

export default ActionCard;