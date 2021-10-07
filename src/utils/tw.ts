import { ComponentProps } from "react"

export const classNames = (...classes: (string|undefined|false|null)[]) => classes.filter(Boolean).join(' ')

export type Heroicon = (props: ComponentProps<'svg'>) => JSX.Element