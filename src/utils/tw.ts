import type {AcademicCapIcon} from '@heroicons/react/24/outline'

export const classNames = (...classes: (string|undefined|false|null)[]) => classes.filter(Boolean).join(' ')

export type Heroicon = typeof AcademicCapIcon