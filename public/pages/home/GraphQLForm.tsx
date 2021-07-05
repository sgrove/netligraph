import * as GraphQL from 'graphql'
import { VariableDefinitionNode } from 'graphql'
import { GraphQLSchema } from 'graphql'
import * as React from 'react'

const {
  isListType,
  isEnumType,
  getNamedType,
  isInputObjectType,
  isScalarType,
  typeFromAST,
} = GraphQL

let labelClassname = 'm-0'

export const updateFormVariables = (
  setFormVariables: (arg0: (oldFormVariables: any) => any) => void,
  path: any,
  coerce: {
    (value: any): boolean
    (value: any): any
    (value: any): any
    (arg0: any): any
  }
) => {
  const setIn = (
    object: { [x: string]: any },
    path: string | any[],
    value: any
  ) => {
    if (path.length === 1) {
      if (value === null) {
        delete object[path[0]]
      } else {
        object[path[0]] = value
      }
    } else {
      if ([undefined, null].indexOf(object[path[0]]) > -1) {
        object[path[0]] = typeof path[1] === 'number' ? [] : {}
      }
      setIn(object[path[0]], path.slice(1), value)
    }
    return object
  }

  const formInputHandler = (event: any) => {
    // We parse the form input, coerce it to the correct type, and then update the form variables
    const rawValue = event.target.value
    // We take a blank input to mean \`null\`
    const value = rawValue === '' ? null : rawValue
    setFormVariables((oldFormVariables) => {
      const newValue = setIn(oldFormVariables, path, coerce(value))
      return { ...newValue }
    })
  }

  return formInputHandler
}

export const formInput = (
  schema: GraphQLSchema,
  def: VariableDefinitionNode,
  setFormVariables: any,
  options: {
    labelClassname?: string
    inputClassName?: string
    checkboxClassName?: string
    defaultValue?: any
    onMouseUp?: (arg0: React.MouseEvent<HTMLInputElement, MouseEvent>) => any
  }
) => {
  const name = def.variable.name.value

  //@ts-ignore
  function helper(
    path: any[],
    type: GraphQL.GraphQLType,
    subfield?: { name: any } | undefined
  ) {
    const isList = isListType(type)

    const namedType = getNamedType(type)
    const isEnum = isEnumType(namedType)
    const isObject = isInputObjectType(namedType)

    if (GraphQL.isObjectType(namedType) && !isInputObjectType(namedType)) {
      return
    }

    const isScalar = isScalarType(namedType)

    const subfieldName = subfield && subfield.name
    let subDataEl

    if (isList) {
      return helper([...path, 0], namedType)
    } else if (isObject) {
      // @ts-ignore: we check this with `isObject` already
      const subFields = namedType.getFields()

      if (!subFields) {
        return 'MISSING_SUBFIELDS'
      }

      const subFieldEls = Object.keys(subFields).map((fieldName) => {
        const currentField = subFields[fieldName]

        const subPath = [...path, fieldName]
        const currentFieldInput = helper(
          subPath,
          currentField.type,
          currentField
        )

        return (
          <div key={fieldName}>
            <label
              key={fieldName}
              className={options?.labelClassname ?? labelClassname}
              htmlFor={subPath.join('-')}
            >
              .{fieldName}
            </label>
            {currentFieldInput}
          </div>
        )
      })

      return (
        <div>
          <fieldset className="ml-2 mt-0 mb-0 border-l border-gray-500">
            {subFieldEls}
          </fieldset>
        </div>
      )
    } else if (isScalar && namedType.name === 'Boolean') {
      const updateFunction = updateFormVariables(
        setFormVariables,
        path,
        (value) => value === 'true'
      )

      subDataEl = (
        <select
          className="ml-2 mr-2 m-0 pt-0 pb-0 pl-4 pr-8 w-full rounded-sm"
          onChange={updateFunction}
          key={path.join('-')}
        >
          <option key={'true'} value={'true'}>
            true
          </option>
          <option key={'false'} value={'false'}>
            false
          </option>
        </select>
      )
    } else if (isScalar) {
      let coerceFn
      let inputAttrs

      // @ts-ignore: we check this with `isScalar` already
      switch (namedType.name) {
        case 'String':
          //@ts-ignore
          coerceFn = (value) => value
          inputAttrs = [
            ['type', 'text'],
            ['className', options?.inputClassName],
          ]
          break
        case 'Float':
          //@ts-ignore
          coerceFn = (value) => {
            try {
              return parseFloat(value)
            } catch (e) {
              return 0.0
            }
          }
          inputAttrs = [
            ['type', 'number'],
            ['step', '0.1'],
          ]
          break
        case 'Int':
          //@ts-ignore
          coerceFn = (value) => {
            try {
              return parseInt(value, 10)
            } catch (e) {
              return 0
            }
          }
          inputAttrs = [
            ['type', 'number'],
            ['className', options?.inputClassName],
          ]
          break
        case 'Boolean':
          //@ts-ignore
          coerceFn = (value) => value === 'true'
          inputAttrs = [
            ['type', 'checkbox'],
            [
              'className',
              options?.checkboxClassName ||
                'toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer',
            ],
          ]
          break
        case 'JSON':
          //@ts-ignore
          coerceFn = (value) => {
            try {
              return JSON.parse(value)
            } catch (e) {
              return null
            }
          }
          inputAttrs = [
            ['type', 'text'],
            ['className', options?.inputClassName],
          ]
          break

        default:
          //@ts-ignore
          coerceFn = (value) => value
          inputAttrs = [
            ['type', 'text'],
            ['className', options?.inputClassName],
          ]
          break
      }

      const updateFunction = updateFormVariables(
        setFormVariables,
        path,
        coerceFn
      )

      let finalInputAttrs = Object.fromEntries(
        //@ts-ignore
        inputAttrs
          .map(([key, value]) => (!!value ? [key, value] : null))
          .filter(Boolean)
      )

      subDataEl = (
        <div
          key={path.join('-')}
          className="relative text-lg bg-transparent text-gray-800"
        >
          <div className="flex items-center ml-2 mr-2">
            <input
              onChange={updateFunction}
              defaultValue={options.defaultValue}
              autoCorrect="false"
              {...finalInputAttrs}
              className="bg-transparent border-none px-2 leading-tight outline-none text-white form-input"
              type="text"
              placeholder={namedType.name}
              onMouseUp={(event) =>
                options.onMouseUp && options.onMouseUp(event)
              }
            />
          </div>
        </div>
      )
    } else if (isEnum) {
      const updateFunction = updateFormVariables(
        setFormVariables,
        path,
        (value: any) => value
      )
      const selectOptions = namedType
        // @ts-ignore: we check this with `isEnum` already
        .getValues()
        //@ts-ignore
        .map((gqlEnum) => {
          const enumValue = gqlEnum.value
          const enumDescription = !!gqlEnum.description
            ? `: ${gqlEnum.description}`
            : ''
          return (
            <option key={enumValue} value={enumValue}>
              {gqlEnum.name}
              {enumDescription}
            </option>
          )
        })

      subDataEl = (
        <select
          className="ml-2 mr-2 m-0 pt-0 pb-0 pl-4 pr-8 w-full rounded-sm"
          onChange={updateFunction}
          key={path.join('-')}
        >
          {selectOptions}
        </select>
      )
    } else {
      return 'UNKNOWN_GRAPHQL_TYPE_FOR_INPUT'
    }

    return subDataEl
  }

  //@ts-ignore
  const hydratedType = typeFromAST(schema, def.type)
  if (!hydratedType) {
    console.warn('\tCould not hydrate type for ', def.type)
    return null
  }

  const formEl = helper([name], hydratedType)

  return <div key={def.variable.name.value}>{formEl}</div>
}
