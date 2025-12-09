import React from 'react'
import { useNavigate} from 'react-router-dom'

const ActionCard = ({ bgc = 'bg-blue-500', link, icon, name, textColor }) => {
  // `bgc` should be a full Tailwind class like 'bg-blue-500'.
  // Avoid dynamic `bg-${...}` which Tailwind cannot detect at build time.
    const navigate = useNavigate();
  return (
    <div onClick={()=>{navigate(`/${link}`)}} className={`p-6 flex flex-col justify-center items-center rounded-lg cursor-pointer hover:shadow-lg transition ${bgc}`}>
      <div className={`${textColor} text-3xl`}>{icon}</div>
      <div className={`${textColor} font-semibold mt-2`}>{name}</div>
    </div>
  )
}

export default ActionCard