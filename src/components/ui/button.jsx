import './button.css';

// Простой универсальный Button, совместимый с Tailwind‑классами из космической игры
// Принимает все стандартные пропсы button и просто добавляет базовый стиль.

export function Button({ className = '', ...props }) {
  return (
    <button
      type="button"
      className={`tg-button-base ${className}`}
      {...props}
    />
  );
}


