import React from 'react';

const Logo = ({ className = "", size = "md", src = '/logo.png', alt = 'Logo' }) => {
  const sizes = {
    sm: "h-10 w-auto",
    md: "h-12 w-auto",
    lg: "h-20 w-auto",
    large: "h-24 w-auto",
    xl: "h-28 w-auto",
    '2xl': "h-32 w-auto",
    login: "h-28 sm:h-32 w-auto"
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img
        src={src}
        alt={alt}
        className={`${sizes[size] || size} object-contain`}
      />
    </div>
  );
};

export default Logo;

