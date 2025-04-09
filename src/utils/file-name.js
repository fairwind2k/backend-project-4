const generateFileName = (url) => {
  const { hostname, pathname } = new URL(url);
  const formattedPath = `${hostname}${pathname}`
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-');
  return `${formattedPath}.html`;
};

export default generateFileName;
