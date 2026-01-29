/**
 * Shared font families for the application
 * Used in FontPicker and other typography-related components
 */

export const FONT_FAMILIES = [
    { value: 'inter', label: 'Inter', fontFamily: 'Inter, system-ui, sans-serif' },
    { value: 'roboto', label: 'Roboto', fontFamily: 'Roboto, sans-serif' },
    { value: 'open-sans', label: 'Open Sans', fontFamily: '"Open Sans", sans-serif' },
    { value: 'lato', label: 'Lato', fontFamily: 'Lato, sans-serif' },
    { value: 'poppins', label: 'Poppins', fontFamily: 'Poppins, sans-serif' },
    { value: 'montserrat', label: 'Montserrat', fontFamily: 'Montserrat, sans-serif' },
    { value: 'source-sans-pro', label: 'Source Sans Pro', fontFamily: '"Source Sans Pro", sans-serif' },
    { value: 'nunito', label: 'Nunito', fontFamily: 'Nunito, sans-serif' },
    { value: 'raleway', label: 'Raleway', fontFamily: 'Raleway, sans-serif' },
    { value: 'ubuntu', label: 'Ubuntu', fontFamily: 'Ubuntu, sans-serif' },
    { value: 'system-ui', label: 'System UI', fontFamily: 'system-ui, -apple-system, sans-serif' },
    { value: 'serif', label: 'Serif', fontFamily: 'Georgia, "Times New Roman", serif' },
    { value: 'mono', label: 'Monospace', fontFamily: 'ui-monospace, "SF Mono", monospace' },
] as const;

export type FontFamilyValue = (typeof FONT_FAMILIES)[number]['value'];
