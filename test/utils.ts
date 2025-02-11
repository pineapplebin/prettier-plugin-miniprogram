import prettier, { type Options } from 'prettier';
import { plugin } from '../src';

export async function wrapFormat(
  content: string,
  options?: Options,
): Promise<string> {
  const formatted = await prettier.format(content, {
    parser: 'wxml',
    plugins: [plugin],
    semi: true,
    ...options,
  });
  console.log('----- start ----\n' + formatted + '\n----- end ----');
  return formatted;
}
