'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@delulu/design-system/lib/utils'

type AnimatedTabsContextValue = {
  registerTrigger: (value: string, el: HTMLButtonElement | null) => void
  unregisterTrigger: (value: string) => void
  getTriggerEl: (value: string) => HTMLButtonElement | null
  setListEl: (el: HTMLDivElement | null) => void
  getListEl: () => HTMLDivElement | null
  activeValue: string | undefined
  elementsVersion: number
}

const AnimatedTabsContext = React.createContext<AnimatedTabsContextValue | null>(
  null,
)

function useAnimatedTabsContext(): AnimatedTabsContextValue {
  const ctx = React.useContext(AnimatedTabsContext)
  if (!ctx) {
    throw new Error('AnimatedTabs components must be used within <AnimatedTabs>')
  }
  return ctx
}

const underlineTransition = { duration: 0.15 }

export function AnimatedTabs(
  props: React.ComponentProps<typeof TabsPrimitive.Root>,
) {
  const { value, defaultValue, onValueChange, className, children, ...rest } =
    props

  const [internalValue, setInternalValue] = React.useState<string | undefined>(
    value ?? defaultValue,
  )

  React.useEffect(() => {
    if (value !== undefined) setInternalValue(value)
  }, [value])

  const triggerMapRef = React.useRef<Map<string, HTMLButtonElement>>(new Map())
  const listRef = React.useRef<HTMLDivElement | null>(null)
  const [elementsVersion, setElementsVersion] = React.useState(0)

  const registerTrigger = React.useCallback(
    (val: string, el: HTMLButtonElement | null) => {
      if (el) triggerMapRef.current.set(val, el)
      else triggerMapRef.current.delete(val)
      setElementsVersion((v) => v + 1)
    },
    [],
  )

  const unregisterTrigger = React.useCallback((val: string) => {
    triggerMapRef.current.delete(val)
    setElementsVersion((v) => v + 1)
  }, [])

  const getTriggerEl = React.useCallback(
    (val: string) => triggerMapRef.current.get(val) ?? null,
    [],
  )

  const setListEl = React.useCallback((el: HTMLDivElement | null) => {
    listRef.current = el
  }, [])

  const getListEl = React.useCallback(() => listRef.current, [])

  const ctxValue = React.useMemo<AnimatedTabsContextValue>(
    () => ({
      registerTrigger,
      unregisterTrigger,
      getTriggerEl,
      setListEl,
      getListEl,
      activeValue: value ?? internalValue,
      elementsVersion,
    }),
    [registerTrigger, unregisterTrigger, getTriggerEl, setListEl, getListEl, value, internalValue, elementsVersion],
  )

  return (
    <AnimatedTabsContext.Provider value={ctxValue}>
      <TabsPrimitive.Root
        data-slot="animated-tabs"
        value={value}
        defaultValue={defaultValue}
        onValueChange={(val) => {
          setInternalValue(val)
          onValueChange?.(val)
        }}
        className={cn('flex flex-col gap-2', className)}
        {...rest}
      >
        {children}
      </TabsPrimitive.Root>
    </AnimatedTabsContext.Provider>
  )
}

export function AnimatedTabsList(
  props: React.ComponentProps<typeof TabsPrimitive.List>,
) {
  const { className, children, ...rest } = props
  const { activeValue, getTriggerEl, setListEl, getListEl, elementsVersion } =
    useAnimatedTabsContext()

  const [indicator, setIndicator] = React.useState<{ x: number; w: number } | null>(
    null,
  )

  const updateIndicator = React.useCallback(() => {
    if (!activeValue) return
    const listEl = getListEl()
    const activeEl = getTriggerEl(activeValue)
    if (!listEl || !activeEl) return
    const listRect = listEl.getBoundingClientRect()
    const elRect = activeEl.getBoundingClientRect()
    setIndicator({ x: elRect.left - listRect.left, w: elRect.width })
  }, [activeValue, getListEl, getTriggerEl, elementsVersion])

  React.useEffect(() => {
    updateIndicator()
    const handle = () => updateIndicator()
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [updateIndicator])

  return (
    <div className={cn('relative')}>
      <TabsPrimitive.List
        ref={setListEl}
        data-slot="animated-tabs-list"
        className={cn(
          'grid w-full grid-cols-[repeat(auto-fit,minmax(0,1fr))] rounded-none border-b bg-transparent p-0',
          className,
        )}
        {...rest}
      >
        {children}
      </TabsPrimitive.List>
      <AnimatePresence>
        {indicator && (
          <motion.div
            key={activeValue}
            className="pointer-events-none absolute bottom-0 left-0 h-[2px] bg-current"
            initial={{ opacity: 0, x: indicator.x, width: indicator.w }}
            animate={{ opacity: 1, x: indicator.x, width: indicator.w }}
            exit={{ opacity: 0 }}
            transition={underlineTransition}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export function AnimatedTabsTrigger(
  props: React.ComponentProps<typeof TabsPrimitive.Trigger>,
) {
  const { className, value, ...rest } = props
  const { registerTrigger, unregisterTrigger } = useAnimatedTabsContext()
  const ref = React.useRef<HTMLButtonElement | null>(null)

  React.useEffect(() => {
    if (typeof value !== 'string') return
    registerTrigger(value, ref.current)
    return () => unregisterTrigger(value)
  }, [value, registerTrigger, unregisterTrigger])

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      data-slot="animated-tabs-trigger"
      className={cn(
        'rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 py-2 text-sm font-medium text-muted-foreground',
        className,
      )}
      value={value}
      {...rest}
    />
  )
}

export function AnimatedTabsContent(
  props: React.ComponentProps<typeof TabsPrimitive.Content>,
) {
  const { className, ...rest } = props
  return (
    <TabsPrimitive.Content
      data-slot="animated-tabs-content"
      className={cn('flex-1 outline-none', className)}
      {...rest}
    />
  )
}

export const AnimatedTabsPrimitive = {
  Root: AnimatedTabs,
  List: AnimatedTabsList,
  Trigger: AnimatedTabsTrigger,
  Content: AnimatedTabsContent,
}


