import { createUnplugin } from 'unplugin'
import { createFilter } from '@rollup/pluginutils'
import {
  REGEX_SETUP_SFC,
  REGEX_VUE_SFC,
  REGEX_VUE_SUB,
  detectVueVersion,
} from '@vue-macros/common'
import { transform } from './core/transform'
import type { UnpluginContextMeta } from 'unplugin'
import type { MarkRequired } from '@vue-macros/common'
import type { FilterPattern } from '@rollup/pluginutils'

export interface Options {
  include?: FilterPattern
  exclude?: FilterPattern
  version?: 2 | 3
}

export type OptionsResolved = MarkRequired<Options, 'include' | 'version'>

function resolveOption(
  options: Options,
  framework: UnpluginContextMeta['framework']
): OptionsResolved {
  const version = options.version || detectVueVersion()
  return {
    include: [REGEX_VUE_SFC, REGEX_SETUP_SFC].concat(
      version === 2 && framework === 'webpack' ? REGEX_VUE_SUB : []
    ),
    ...options,
    version,
  }
}

export default createUnplugin<Options | undefined, false>(
  (userOptions = {}, { framework }) => {
    const options = resolveOption(userOptions, framework)
    const filter = createFilter(options.include, options.exclude)

    const name = 'unplugin-vue-define-options'
    return {
      name,
      enforce: 'pre',

      transformInclude(id) {
        return filter(id)
      },

      transform(code, id) {
        try {
          return transform(code, id)
        } catch (err: unknown) {
          this.error(`${name} ${err}`)
        }
      },
    }
  }
)

export { transform }
