
export const Button = ({
  onClick,
  children,
  className,
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full bg-highlight-green text-black font-bold py-4 rounded-lg ${className}`}
    >
      {children}
    </button>
  );
};

