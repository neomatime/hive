'use client'

import * as React from 'react'
import type { ControllerFieldState, ControllerProps, FieldPath, FieldValues } from 'react-hook-form'
import { Controller, FormProvider as HookFormProvider } from 'react-hook-form'

import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

const Form = HookFormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName
  fieldState: ControllerFieldState
  formItemId: string
  formDescriptionId: string
  formMessageId: string
}

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue)

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>')
  }

  return {
    ...fieldContext,
    formItemId: itemContext.formItemId,
    formDescriptionId: itemContext.formDescriptionId,
    formMessageId: itemContext.formMessageId,
  }
}

type FormItemContextValue = {
  formItemId: string
  formDescriptionId: string
  formMessageId: string
}

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue)

// Generic over TFieldValues/TName (and react-hook-form's schema-transform
// param TTransformedValues) so TypeScript infers the concrete field-values
// type from `control` (or from the ambient useFormContext() the caller is
// in), exactly like upstream react-hook-form's own <Controller>. This must
// stay a plain generic function -- React.forwardRef cannot carry inferred
// generic type parameters through to callers, which is what previously
// forced `name` to widen to the untyped `FieldPath<FieldValues>` (~string)
// and silently accepted typo'd field names.
//
// Props are spread onto <Controller> as a single object (rather than
// destructured field-by-field) so TypeScript unifies TFieldValues/TName/
// TTransformedValues from one object-typed inference site; Controller
// itself already falls back to useFormContext() internally when `control`
// is omitted, so no manual useFormContext() fallback is needed here.
function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>(props: ControllerProps<TFieldValues, TName, TTransformedValues>) {
  const formItemId = React.useId()
  const formDescriptionId = React.useId()
  const formMessageId = React.useId()

  return (
    <Controller
      {...props}
      render={({ field, fieldState, formState }) => (
        <FormFieldContext.Provider
          value={{ name: props.name, fieldState, formItemId, formDescriptionId, formMessageId }}
        >
          <FormItemContext.Provider value={{ formItemId, formDescriptionId, formMessageId }}>
            {props.render({ field, fieldState, formState })}
          </FormItemContext.Provider>
        </FormFieldContext.Provider>
      )}
    />
  )
}
FormField.displayName = 'FormField'

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const formItemId = React.useId()
    const formDescriptionId = React.useId()
    const formMessageId = React.useId()

    return (
      <FormItemContext.Provider value={{ formItemId, formDescriptionId, formMessageId }}>
        <div ref={ref} className={cn('space-y-2', className)} {...props} />
      </FormItemContext.Provider>
    )
  }
)
FormItem.displayName = 'FormItem'

const FormLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => {
  const { fieldState, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      htmlFor={formItemId}
      className={cn(fieldState.error && 'text-destructive', className)}
      {...props}
    />
  )
})
FormLabel.displayName = 'FormLabel'

const FormControl = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { children: React.ReactElement }
>(({ children, ...props }, ref) => {
  const { fieldState, formItemId, formDescriptionId, formMessageId } = useFormField()

  const childClassName = (children.props as Record<string, unknown>)?.className || ''

  return React.cloneElement(children, {
    ref,
    ...props,
    id: formItemId,
    'aria-describedby': !fieldState.error ? formDescriptionId : formMessageId,
    'aria-invalid': !!fieldState.error,
    'data-has-error': !!fieldState.error,
    className: cn(childClassName as string, props.className),
  } as React.HTMLAttributes<HTMLElement> & Record<string, unknown>)
})
FormControl.displayName = 'FormControl'

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
})
FormDescription.displayName = 'FormDescription'

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { fieldState, formMessageId } = useFormField()
  const body = fieldState.error ? String(fieldState.error?.message) : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn('text-sm font-medium text-destructive', className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = 'FormMessage'

export { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage }
