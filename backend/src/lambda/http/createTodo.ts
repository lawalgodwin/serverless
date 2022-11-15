import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getUserId } from '../utils'

import { createTodo } from '../../businessLayer/ToDo'
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      const newTodo: CreateTodoRequest = JSON.parse(event.body)

      const userId = getUserId(event)
      const todo = await createTodo(newTodo, userId)

      return {
        statusCode: 201,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({
          item: todo
        })
      }
    } catch ( error ) {
       return {
         statusCode: error?.statusCode || 400,

         body: JSON.stringify({
           message: error?.message || 'error while trying to get create todo'
         })
       }
    }
  }
)

handler.use(
  cors({
    credentials: true
  })
)
