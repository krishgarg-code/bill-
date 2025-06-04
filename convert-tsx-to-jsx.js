import { convertTsxToJsx } from 'tsx-to-jsx';

const srcDirectory = './src';
const destDirectory = './src-jsx';

convertTsxToJsx(srcDirectory, destDirectory)
  .then(() => console.log('Conversion complete!'))
  .catch((err) => console.error('Conversion failed:', err)); 