────────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useState, useEffect } from "react";
import { getFactorRecipes } from "../services/FactorMath";

interface FactorRecipeListProps {
  target: number;
  showFactorList: boolean;
}

export const FactorRecipeList: React.FC<FactorRecipeListProps> = ({
  target,
  showFactorList,
}) => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1000);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const recipes = useMemo(() => {
    if (!showFactorList) return [];

    const allRecipes = getFactorRecipes(target);
    
    // Responsive limit: 2 on small phone, 3 on phone, 4 on tablet/desktop
    const maxRecipes = windowWidth < 380 ? 2 : windowWidth < 640 ? 3 : 4;
    return allRecipes.slice(0, maxRecipes);
  }, [target, showFactorList, windowWidth]);

  if (!showFactorList || recipes.length === 0) return null;

  return (
    <div className="flex flex-nowrap overflow-hidden gap-1 sm:gap-1.5 justify-center items-center w-full px-1 sm:px-2 py-1 sm:py-1.5 box-border">
      {recipes.map((recipe, index) => (
        <div
          key={index}
          className="bg-[#FFFDF9] border-[1.5px] border-[#8D6E63]/30 rounded-2xl px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-sm font-extrabold text-[#2D1B1B] flex items-center gap-0.5 shadow-sm sm:text-base whitespace-nowrap shrink-0"
          style={{
            // Inline style fallback for very specific aesthetic control if needed
            boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
          }}
        >
          {recipe.map((factor, i) => (
            <React.Fragment key={i}>
              <span className="text-[#3E2723]">{factor}</span>
              {i < recipe.length - 1 && (
                <span className="text-[#8D6E63] font-normal mx-0.5 opacity-60 text-xs sm:text-sm">×</span>
              )}
            </React.Fragment>
          ))}
        </div>
      ))}
    </div>
  );
};
────────────────────────────────────────────────────────────────────────────────
