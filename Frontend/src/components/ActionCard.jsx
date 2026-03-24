import React from 'react';
import { useNavigate } from 'react-router-dom';

const ActionCard = ({
  bgColor,
  textColor,
  link,
  icon,
  name,
}) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/${link}`)}
      className="p-4 flex flex-col justify-center items-center rounded-lg cursor-pointer hover:shadow-xl transition-shadow duration-300"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div className="w-10 h-10 flex items-center justify-center">
        {icon}
      </div>
      <div className="font-semibold mt-2 text-center text-sm">{name}</div>
    </div>
  );
};

export default ActionCard;