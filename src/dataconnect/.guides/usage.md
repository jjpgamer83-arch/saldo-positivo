# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createTransaction, updateTransaction, deleteTransaction, createCategory, listTransactions, listCategories } from '@firebasegen/default-connector';


// Operation CreateTransaction:  For variables, look at type CreateTransactionVars in ../index.d.ts
const { data } = await CreateTransaction(dataConnect, createTransactionVars);

// Operation UpdateTransaction:  For variables, look at type UpdateTransactionVars in ../index.d.ts
const { data } = await UpdateTransaction(dataConnect, updateTransactionVars);

// Operation DeleteTransaction:  For variables, look at type DeleteTransactionVars in ../index.d.ts
const { data } = await DeleteTransaction(dataConnect, deleteTransactionVars);

// Operation CreateCategory:  For variables, look at type CreateCategoryVars in ../index.d.ts
const { data } = await CreateCategory(dataConnect, createCategoryVars);

// Operation ListTransactions: 
const { data } = await ListTransactions(dataConnect);

// Operation ListCategories: 
const { data } = await ListCategories(dataConnect);


```