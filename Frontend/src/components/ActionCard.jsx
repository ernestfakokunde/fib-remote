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
      className="animate-fade-up flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-white/10 p-5 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{
        background: `linear-gradient(135deg, ${bgColor}, color-mix(in srgb, ${bgColor} 68%, white))`,
        color: textColor,
        boxShadow: '0 18px 40px -24px rgba(15, 23, 42, 0.45)',
      }}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
        {icon}
      </div>
      <div className="mt-3 text-center text-sm font-semibold">{name}</div>
    </div>
  );
};

export default ActionCard;
