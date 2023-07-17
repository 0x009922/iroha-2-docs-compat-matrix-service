import { Application, Router } from "oak";
import {Matrix} from "./aggregate.ts";
import { getLogger } from "log";


import oakLogger from "oak-logger";






const logger = () => getLogger('web')

export interface MatrixProvider {
  getMatrix(): Promise<Matrix>;
}

export async function run(params: {
  port: number
  provider: MatrixProvider
}) {
  const router = new Router()

  router
    .get('/compat-matrix', async (ctx) => {
      ctx.response.body = await params.provider.getMatrix();
    })

  const app = new Application();

  app.use(oakLogger.logger)
  app.use(oakLogger.responseTime)
  app.use(router.routes());
  app.use(router.allowedMethods());

  logger().info(`Server listening on port ${params.port}`)

  await app.listen({ port: params.port });
}

