// /conponents/section/HeaderSub/ButtonTheme.js
'use client';

import { useEffect, useState } from 'react';
import { SwatchBook } from 'lucide-react';

const themes = ['modern', 'classic'];
const themeNames = {
  modern: 'โมเดิน',
  classic: 'คลาสสิก',
};

export default function ButtonTheme() {
  const [currentTheme, setCurrentTheme] = useState('classic');

  const toggleTheme = () => {
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    setCurrentTheme(nextTheme);
  };

  useEffect(() => {
    document.body.className = currentTheme === 'classic' ? '' : `${currentTheme}-theme`;
  }, [currentTheme]);

  return (
    <button className="theme-toggle" onClick={toggleTheme}>
      <SwatchBook />
      <span>{themeNames[currentTheme]}</span>
    </button>
  );
}
