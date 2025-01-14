import 'source-map-support/register'

import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult
} from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { createTodoItem } from '../../businessLogic/todoItems'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

const logger = createLogger('createTodo')

const createTodoHandler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  logger.info('Caller event', event)

  const userId = getUserId(event)
  const payload = JSON.parse(event.body || '') as CreateTodoRequest
  if (!payload.name) {

    throw new Error("Please specify a name");
  }
  const item = await createTodoItem(userId, payload)

  logger.info('Todo item was created', { userId, todoId: item.todoId })

  return {
    statusCode: 201,
    body: JSON.stringify({ item })
  }
}

export const handler = middy(createTodoHandler).use(cors({ credenials: true }))
