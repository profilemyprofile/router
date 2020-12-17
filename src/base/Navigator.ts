import {
  HistoryListener,
  HistoryListenerHandler,
  HistoryItemState,
  SerializedURLParams,
} from '../shared/types'
import { areArraysEqual, hasIntersections, areObjectsEqual } from '../utils'

export class Navigator {
  private readonly listeners: HistoryListener[] = []
  /**
   * Список задач, которые будут выполненны при каждом
   * вызове жизненного цикла.
   */
  private readonly tasks: VoidFunction[] = []
  private isFrozenLifecycle = false

  constructor() {
    window.addEventListener('popstate', this.lifecycle)
  }

  /**
   * Жизненный цикл, через который проходит каждая запись в истории.
   */
  private lifecycle = () => {
    if (this.isFrozenLifecycle) {
      return
    }

    this.syncRunTasks()
    this.getListenersForCurrentLocation().forEach(({ handler }) =>
      handler(this.convertSearchParams(this.location.search))
    )
  }

  /**
   * Выполнение всех задач из списка.
   */
  private syncRunTasks = () => {
    this.tasks.forEach(task => task())
  }

  /**
   * Возвращает всех слушателей для текущей записи в истории.
   */
  private getListenersForCurrentLocation() {
    return this.findListenersByKeys([
      ...Object.keys(this.convertSearchParams(this.location.search)),
      '*',
    ])
  }

  /**
   * Создаёт слушатель, который реагирует на изменения URL-параметров
   * в истории браузера.
   */
  createListener = <K extends string[]>(
    keys: K,
    handler: HistoryListenerHandler<K>
  ) => {
    this.listeners.push({
      keys,
      handler,
    })
  }

  removeListener = <K extends string[]>(
    keys: K,
    handler: HistoryListenerHandler<K>
  ) => {
    // prettier-ignore
    let index = this.listeners.findIndex(listener =>
      listener.handler === handler && areArraysEqual(listener.keys, keys)
    )

    if (index) this.listeners.splice(index, 1)
  }

  /**
   * Создаёт задачу, которая будет выполнена вначале
   * каждого жизненного цикла.
   */
  createTask = (task: VoidFunction) => {
    this.tasks.push(task)
  }

  removeTask = (task: VoidFunction) => {
    let index = this.tasks.findIndex(e => e === task)
    if (index) this.tasks.splice(index, 1)
  }

  get location() {
    return window.location
  }

  get history() {
    return window.history
  }

  /**
   * Преобразует строку URL-параметров в объект.
   *
   * ```
   * ?panel=info => { panel: 'info' }
   * ```
   */
  convertSearchParams(search: string): SerializedURLParams
  /**
   * Преобразует объект в строку URL-параметров.
   *
   * ```
   * { panel: 'info' } => ?panel=info
   * ```
   */
  convertSearchParams(search: SerializedURLParams): string
  convertSearchParams(
    search: string | SerializedURLParams
  ): string | SerializedURLParams {
    if (typeof search === 'string') {
      return Object.fromEntries(new URLSearchParams(search))
    }

    return '?' + new URLSearchParams(search)
  }

  /**
   * Ищет слушателей по массиву с ключами.
   */
  private findListenersByKeys = (keys: string[]) => {
    return this.listeners.filter(listener =>
      hasIntersections(keys, listener.keys)
    )
  }

  /**
   * Добавляет новую запись в историю браузера. Если новая запись
   * равна текущей, то метод пропускает добавление.
   *
   * https://developer.mozilla.org/ru/docs/Web/API/History/pushState
   */
  push = <T>(
    record: Record<string, string>,
    state: HistoryItemState<T> = {}
  ) => {
    if (
      this.convertSearchParams(record) === this.location.search &&
      areObjectsEqual(record, this.history.state)
    ) {
      return
    }

    this.history.pushState(state, '', this.convertSearchParams(record))
    this.dispatchEvent(state)
  }

  /**
   * Изменяет текущую запись в истории. Данный метод особенно полезен,
   * когда вы хотите обновить объект состояния или URL текущей записи
   * в истории в ответ на какое-то действие пользователя.
   *
   * https://developer.mozilla.org/ru/docs/Web/API/History/replaceState
   */
  replace = <T>(
    record: Record<string, string>,
    state: HistoryItemState<T> = {}
  ) => {
    this.history.replaceState(state, '', this.convertSearchParams(record))
    this.dispatchEvent(state)
  }

  /**
   * Возвращает на прошлую страницу в истории, или если такой нет,
   * закрывает приложение.
   */
  back = this.history.back

  /**
   * Выполняет переход на определенную страницу в истории текущей сессии.
   * С его помощью можно перемещаться как вперед, так и назад,
   * в зависимости от значения параметра.
   */
  go = this.history.go

  /**
   * Вызывает событие `popstate`, передавая в качестве состояния
   * передаваемый объект.
   */
  dispatchEvent<T>(state: HistoryItemState<T>) {
    window.dispatchEvent(new PopStateEvent('popstate', { state }))
  }

  /**
   * Приостанавливает работу жизненого цикла.
   */
  freezeLifecycle = () => {
    this.isFrozenLifecycle = true
  }

  /**
   * Возобновляет работу жизненного цикла.
   */
  unfreezeLifecycle = () => {
    this.isFrozenLifecycle = false
  }
}
