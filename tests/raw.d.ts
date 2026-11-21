// Vite hands a file's text over as a string when it is imported with ?raw.
declare module "*?raw" {
  const text: string;
  export default text;
}
