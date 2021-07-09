import { ComponentProps } from "react"

export const classNames = (...classes: string[]) => classes.filter(Boolean).join(' ')

export type Heroicon = (props: ComponentProps<'svg'>) => JSX.Element