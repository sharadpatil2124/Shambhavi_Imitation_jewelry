import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "instant", // Instant jump is best for page transitions in e-commerce
    });
  }, [pathname]);

  return null;
}
