import React from "react";

const LoadingSpinner = ({ size = "md", text = "" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <div
        className={`${sizeClasses[size]} border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin`}
      />
      {text && <span className="text-gray-600 text-sm">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;
