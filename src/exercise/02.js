// useCallback: custom hooks
// http://localhost:3000/isolated/exercise/02.js

import * as React from 'react'
import {
  fetchPokemon,
  PokemonForm,
  PokemonDataView,
  PokemonInfoFallback,
  PokemonErrorBoundary,
} from '../pokemon'

const IDLE = 'idle'
const PENDING = 'pending'
const RESOLVED = 'resolved'
const REJECTED = 'rejected'

function asyncReducer(state, action) {
  switch (action.type) {
    case PENDING: {
      return {status: PENDING, data: null, error: null}
    }
    case RESOLVED: {
      return {status: RESOLVED, data: action.data, error: null}
    }
    case REJECTED: {
      return {status: REJECTED, data: null, error: action.error}
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`)
    }
  }
}

const useAsync = (initialState) => {
  const [state, dispatch] = React.useReducer(asyncReducer, {
    status: IDLE,
    data: null,
    error: null,
    ...initialState,
  })

  const run = React.useCallback(
    promise => {
      dispatch({type: PENDING})

      promise.then(
        data => {
          dispatch({type: RESOLVED, data})
        }
      ).catch(error => {
        if (error.name === 'AbortError') {
          return
        }

        dispatch({type: REJECTED, error})
      })
    },
    []
  )

  return {...state, run}
}

function PokemonInfo({pokemonName}) {
  const {data: pokemon, status, error, run} = useAsync({
    status: pokemonName ? 'pending' : 'idle',
  })

  React.useEffect(() => {
    if (!pokemonName) {
      return
    }

    const controller = new AbortController();

    run(fetchPokemon(pokemonName, 1500, controller.signal))

    return () => controller.abort()
  }, [pokemonName, run])

  if (status === IDLE || !pokemonName) {
    return 'Submit a pokemon'
  } else if (status === PENDING) {
    return <PokemonInfoFallback name={pokemonName} />
  } else if (status === REJECTED) {
    throw error
  } else if (status === RESOLVED) {
    return <PokemonDataView pokemon={pokemon} />
  }

  throw new Error('This should be impossible')
}

function App() {
  const [pokemonName, setPokemonName] = React.useState('')

  function handleSubmit(newPokemonName) {
    setPokemonName(newPokemonName)
  }

  function handleReset() {
    setPokemonName('')
  }

  return (
    <div className="pokemon-info-app">
      <PokemonForm pokemonName={pokemonName} onSubmit={handleSubmit} />
      <hr />
      <div className="pokemon-info">
        <PokemonErrorBoundary onReset={handleReset} resetKeys={[pokemonName]}>
          <PokemonInfo pokemonName={pokemonName} />
        </PokemonErrorBoundary>
      </div>
    </div>
  )
}

function AppWithUnmountCheckbox() {
  const [mountApp, setMountApp] = React.useState(true)
  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={mountApp}
          onChange={e => setMountApp(e.target.checked)}
        />{' '}
        Mount Component
      </label>
      <hr />
      {mountApp ? <App /> : null}
    </div>
  )
}

export default AppWithUnmountCheckbox
