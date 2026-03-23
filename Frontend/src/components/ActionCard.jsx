import React from 'react';
import { useNavigate } from 'react-router-dom';

const ActionCard = ({
  gradient = 'gradient-1',
  link,
  icon,
  name,
}) => {
  const navigate = useNavigate();

  const cardClasses = `p-6 flex flex-col justify-center items-center rounded-lg cursor-pointer hover:shadow-lg transition ${gradient}`;

  return (
    <div
      onClick={() => navigate(`/${link}`)}
      className={cardClasses}
      style={{ color: 'white' }}
    >
      <div className={`text-3xl`}>{icon}</div>
      <div className={`font-semibold mt-2`}>{name}</div>
    </div>
  );
};

export default ActionCard;