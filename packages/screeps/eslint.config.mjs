import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import screeps from 'eslint-plugin';

export default tseslint.config(eslint.configs.recommended, tseslint.configs.recommended, {
    plugins: {
        screeps: screeps.plugin,
    },
    rules: {
        'no-unused-private-class-members': 'off',
        'no-unused-vars': 'off',
        'no-unused-expressions': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/consistent-type-imports': 'error',
        'screeps/no-class-expression': 'error',
        'screeps/no-method-as-property': 'error',
        'screeps/call-super': 'error',
    },
    files: ['src/**/*.ts'],
});
