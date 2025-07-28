import { BaseQueryExecutor } from ".";

export class QueryExecutorFactory {
    private static executor: BaseQueryExecutor;

    static getInstance() {
        if (!this.executor) {
            this.executor = new BaseQueryExecutor();
        }

        return this.executor;
    }
}