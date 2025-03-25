const generateFileName = (url) => {
    const { hostname, pathname } = new URL(url);
    const formattedPath = `${hostname}${pathname}`
      .replace(/[^a-zA-Z0-9]/g, '-') // Заменяем все символы, кроме букв и цифр, на `-`
      .replace(/-+/g, '-'); // Убираем двойные дефисы
    return `${formattedPath}.html`;
  };
  
  export default generateFileName;
