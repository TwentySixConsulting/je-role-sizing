import { useEffect, useState } from 'react'

export type Route =
  | { name: 'library' }
  | { name: 'new' }
  | { name: 'evaluate'; id: string }
  | { name: 'report'; id: string }
  | { name: 'compare' }
  | { name: 'scheme' }
  | { name: 'settings' }

function parse(hash: string): Route {
  const path = hash.replace(/^#\/?/, '')
  const [head, arg] = path.split('/')
  switch (head) {
    case 'new':
      return { name: 'new' }
    case 'evaluate':
      return arg ? { name: 'evaluate', id: arg } : { name: 'library' }
    case 'report':
      return arg ? { name: 'report', id: arg } : { name: 'library' }
    case 'compare':
      return { name: 'compare' }
    case 'scheme':
      return { name: 'scheme' }
    case 'settings':
      return { name: 'settings' }
    default:
      return { name: 'library' }
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash))
  useEffect(() => {
    const onChange = () => setRoute(parse(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export function go(path: string) {
  window.location.hash = path.startsWith('#') ? path : `#/${path.replace(/^\//, '')}`
}
