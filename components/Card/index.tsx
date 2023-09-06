import React, { Children, useState } from 'react';

interface Props {
  children: React.ReactNode;
}

const Card = ({ children }: Props) => {
  return (
    <div
      className="border
    border-gray-200
    hover:bg-hover shadow-lg shadow-hover-500/40 rounded-md    cursor-pointer"
    >
      {children}
    </div>
  );
};
export default Card;
