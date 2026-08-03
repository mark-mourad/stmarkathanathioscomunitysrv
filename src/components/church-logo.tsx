import logo from "@/assets/church-logo.png";

export function ChurchLogo({ size = 96, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src={logo}
      alt="كنيسة القديس مارمرقس والبابا أثناسيوس"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
}
