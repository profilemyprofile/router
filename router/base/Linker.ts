import * as Base from '../base'

/**
 * Линкер привязывает любое значение к уникальному id и ключу, добавляя
 * их в историю.
 *
 * ```typescript
 * linker.push(<Alert />, 'alert')
 * linker.getCurrent('alert') // <Alert />
 * linker.back()
 * linker.getCurrent('alert') // null
 *
 * // multiply
 * linker.push(<Alert />, 'alert')
 * linker.push(<Modal />, 'modal')
 *
 * linker.getCurrent('alert') // null
 * linker.getCurrent('modal') // <Modal />
 *
 * linker.back()
 * linker.getCurrent('alert') // <Alert />
 * linker.getCurrent('modal') // null
 * ```
 *
 * Это моя суперская и гениальная разработка (да-да, такой вот я крутой)
 */
export class Linker extends Base.Cache<string, unknown> {
  static Fallback = null

  constructor(private readonly navigator: Base.Navigator) {
    super()
  }

  /**
   * Позволяет добавить в историю любое значение, привязав его к
   * уникальному id и ключу.
   */
  push = (el: unknown, key: string) => {
    let id = this.makeId()
    this.set(id, el)

    return this.navigator.duplicateRecord({ __linkerId: id, __linkerKey: key })
  }

  getCurrent = (key: string) => {
    let { state } = this.navigator.history

    if (!state || state.__linkerKey !== key) {
      return Linker.Fallback
    }

    return this.get(state.__linkerId) || Linker.Fallback
  }

  back = (key: string) => {
    if (this.getCurrent(key) !== Linker.Fallback) {
      return this.navigator.back()
    }
  }

  private makeId = () => '' + Math.random()
}
