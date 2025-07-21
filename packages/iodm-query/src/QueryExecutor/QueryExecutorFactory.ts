import { BaseQueryExecutor } from ".";

export class QueryExecutorFactory {
    private static executor: BaseQueryExecutor;

    static get() {
        if (!this.executor) {
            this.executor = new BaseQueryExecutor();
        }

        return this.executor;
    }
}