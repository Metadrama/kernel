import type { ComponentCard } from '@/types/dashboard';

export const AVAILABLE_COMPONENTS: ComponentCard[] = [
  {
    id: 'sql-data',
    name: 'SQL Data',
    description: 'SQL database, which can help make your node system wider and a variety',
    icon: 'Database',
    category: 'stores-utility',
    isFavorite: false,
  },
  {
    id: 'table',
    name: 'Table',
    description: "A component to help you sort the data that you've gathered in your field",
    icon: 'Table',
    category: 'stores-utility',
    isFavorite: false,
  },
  {
    id: 'webhook',
    name: 'Webhook',
    description: 'Be aware of your data changing through the webhook notifications',
    icon: 'Webhook',
    category: 'stores-utility',
    isFavorite: true,
  },
  {
    id: 'python',
    name: 'Python',
    description: 'Node code system that can give you the possibility to make your data flexible',
    icon: 'Code',
    category: 'stores-utility',
    isFavorite: false,
  },
  {
    id: 'markdown',
    name: 'Markdown',
    description: 'Basic lightweight markup language system that gives you the possibility to create text in nodes',
    icon: 'FileText',
    category: 'stores-utility',
    isFavorite: true,
  },
  {
    id: 'chart',
    name: 'Chart',
    description: 'Chart system that can pull up information everywhere. Just set it up.',
    icon: 'BarChart3',
    category: 'stores-utility',
    isFavorite: false,
  },
];
