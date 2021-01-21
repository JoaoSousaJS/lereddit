
import { UsernamePasswordInput } from '../resolvers/user/UsernamePasswordInput'

export const validateRegister = (options: UsernamePasswordInput) => {
  if (options.username.length <= 2) {
    return {
      errors: [{
        field: 'username',
        message: 'length must be greater than 2'
      }]
    }
  }

  if (options.username.includes('@')) {
    return {
      errors: [{
        field: 'username',
        message: 'cannot include an @'
      }]
    }
  }

  if (!options.email.includes('@')) {
    return {
      errors: [{
        field: 'email',
        message: 'invalid email'
      }]
    }
  }

  if (options.password.length <= 3) {
    return {
      errors: [{
        field: 'password',
        message: 'length must be greater than 3'
      }]
    }
  }

  if (!UsernamePasswordInput) {
    return {
      errors: [
        {
          field: 'username/field',
          message: 'that username or email does not exist'
        }
      ]
    }
  }

  return null
}
