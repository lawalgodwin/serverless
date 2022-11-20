import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';
// import { getDocumentClient } from '@shelf/aws-ddb-with-xray'
import * as AWS from 'aws-sdk'
const AWSXRay = require('aws-xray-sdk')


const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic

export function createDynamoDBClient() {
    if (process.env.IS_OFFLINE) {
        console.log()
        return new XAWS.DynamoDB.DocumentClient({
            region: 'localhost',
            endpoint: 'http://localhost:8000'
        })
    }

    return new XAWS.DynamoDB.DocumentClient()
}

export class TodosAccess {

    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        // private readonly docClient: DocumentClient = getDocumentClient({
        //     ddbParams: { region: 'us-east-1', convertEmptyValues: true },
        //     ddbClientParams: { region: 'us-east-1' },
        // }),
        private readonly todosTable = process.env.TODOS_TABLE,
        private readonly todoCreatedAtIndex = process.env.TODOS_CREATED_AT_INDEX,
    ) {
    }

    async getAllTodos(userId: string): Promise<TodoItem[]> {
        logger.info(`Retrieving todos for user ${userId}`)

        const result = await this.docClient.query({
            TableName: this.todosTable,
            IndexName: this.todoCreatedAtIndex,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise()

        const { Items } = result;
        return Items as TodoItem[];
    }

    async createTodo(todoItem: TodoItem): Promise<TodoItem> {
        await this.docClient.put({
            TableName: this.todosTable,
            Item: todoItem
        }).promise();

        return todoItem;
    }


    async updateTodo(todoId: string, userId: string, updatedTodoItem: TodoUpdate): Promise<void> {
        // form the update expression and the expression attribute values

        const params = {
            TableName: this.todosTable,
            Key: {
                todoId: todoId,
                userId: userId
            },
            UpdateExpression: 'set #name = :name, dueDate = :dueDate, done = :done',
            ExpressionAttributeNames: {
                "#name": "name"
            },
            ExpressionAttributeValues: {
                ":name": updatedTodoItem?.name,
                ":dueDate": updatedTodoItem?.dueDate,
                ":done": updatedTodoItem?.done
            },
            ReturnValues: 'UPDATED_NEW'
        };

        await this.docClient.update(params).promise();
    }

    async deleteTodo(todo: TodoItem): Promise<void> {
        const { todoId, userId } = todo;
        const params = {
            TableName: this.todosTable,
            Key: {
                todoId,
                userId
            },
        };
        await this.docClient.delete(params).promise();
    }

    async getSingleTodo(todoId: string, userId: string): Promise<TodoItem> {
        const result = await this.docClient.get({
            TableName: this.todosTable,
            Key: {
                todoId: todoId,
                userId: userId
            }
        }).promise()

        const { Item } = result;
        return Item as TodoItem;
    }

}