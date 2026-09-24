import React from 'react';

const Logo = ({ className = "", size = "md" }) => {
  const sizes = {
    sm: "h-10 w-auto",
    md: "<h-28></h-28> w-auto",
    lg: "h-24 w-auto",
    large: "h-24 w-auto",
    xl: "h-28 w-auto"
  };

  const src = '/logo.png';
  const alt = 'Zeu-Tech';

  return (
    <div className={`flex items-center ${className}`}>
      <img
        src={src}
        alt={alt}
        className={sizes[size]}
      />
    </div>
  );
};

export default Logo;
