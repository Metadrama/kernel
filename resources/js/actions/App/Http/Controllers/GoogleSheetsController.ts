import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\GoogleSheetsController::test
 * @see app/Http/Controllers/GoogleSheetsController.php:21
 * @route '/api/sheets/test'
 */
export const test = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: test.url(options),
    method: 'get',
})

test.definition = {
    methods: ["get","head"],
    url: '/api/sheets/test',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\GoogleSheetsController::test
 * @see app/Http/Controllers/GoogleSheetsController.php:21
 * @route '/api/sheets/test'
 */
test.url = (options?: RouteQueryOptions) => {
    return test.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\GoogleSheetsController::test
 * @see app/Http/Controllers/GoogleSheetsController.php:21
 * @route '/api/sheets/test'
 */
test.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: test.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\GoogleSheetsController::test
 * @see app/Http/Controllers/GoogleSheetsController.php:21
 * @route '/api/sheets/test'
 */
test.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: test.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\GoogleSheetsController::test
 * @see app/Http/Controllers/GoogleSheetsController.php:21
 * @route '/api/sheets/test'
 */
    const testForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: test.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\GoogleSheetsController::test
 * @see app/Http/Controllers/GoogleSheetsController.php:21
 * @route '/api/sheets/test'
 */
        testForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: test.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\GoogleSheetsController::test
 * @see app/Http/Controllers/GoogleSheetsController.php:21
 * @route '/api/sheets/test'
 */
        testForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: test.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    test.form = testForm
/**
* @see \App\Http\Controllers\GoogleSheetsController::read
 * @see app/Http/Controllers/GoogleSheetsController.php:73
 * @route '/api/sheets/read'
 */
export const read = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: read.url(options),
    method: 'post',
})

read.definition = {
    methods: ["post"],
    url: '/api/sheets/read',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\GoogleSheetsController::read
 * @see app/Http/Controllers/GoogleSheetsController.php:73
 * @route '/api/sheets/read'
 */
read.url = (options?: RouteQueryOptions) => {
    return read.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\GoogleSheetsController::read
 * @see app/Http/Controllers/GoogleSheetsController.php:73
 * @route '/api/sheets/read'
 */
read.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: read.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\GoogleSheetsController::read
 * @see app/Http/Controllers/GoogleSheetsController.php:73
 * @route '/api/sheets/read'
 */
    const readForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: read.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\GoogleSheetsController::read
 * @see app/Http/Controllers/GoogleSheetsController.php:73
 * @route '/api/sheets/read'
 */
        readForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: read.url(options),
            method: 'post',
        })
    
    read.form = readForm
/**
* @see \App\Http\Controllers\GoogleSheetsController::write
 * @see app/Http/Controllers/GoogleSheetsController.php:102
 * @route '/api/sheets/write'
 */
export const write = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: write.url(options),
    method: 'post',
})

write.definition = {
    methods: ["post"],
    url: '/api/sheets/write',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\GoogleSheetsController::write
 * @see app/Http/Controllers/GoogleSheetsController.php:102
 * @route '/api/sheets/write'
 */
write.url = (options?: RouteQueryOptions) => {
    return write.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\GoogleSheetsController::write
 * @see app/Http/Controllers/GoogleSheetsController.php:102
 * @route '/api/sheets/write'
 */
write.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: write.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\GoogleSheetsController::write
 * @see app/Http/Controllers/GoogleSheetsController.php:102
 * @route '/api/sheets/write'
 */
    const writeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: write.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\GoogleSheetsController::write
 * @see app/Http/Controllers/GoogleSheetsController.php:102
 * @route '/api/sheets/write'
 */
        writeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: write.url(options),
            method: 'post',
        })
    
    write.form = writeForm
/**
* @see \App\Http\Controllers\GoogleSheetsController::append
 * @see app/Http/Controllers/GoogleSheetsController.php:132
 * @route '/api/sheets/append'
 */
export const append = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: append.url(options),
    method: 'post',
})

append.definition = {
    methods: ["post"],
    url: '/api/sheets/append',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\GoogleSheetsController::append
 * @see app/Http/Controllers/GoogleSheetsController.php:132
 * @route '/api/sheets/append'
 */
append.url = (options?: RouteQueryOptions) => {
    return append.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\GoogleSheetsController::append
 * @see app/Http/Controllers/GoogleSheetsController.php:132
 * @route '/api/sheets/append'
 */
append.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: append.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\GoogleSheetsController::append
 * @see app/Http/Controllers/GoogleSheetsController.php:132
 * @route '/api/sheets/append'
 */
    const appendForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: append.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\GoogleSheetsController::append
 * @see app/Http/Controllers/GoogleSheetsController.php:132
 * @route '/api/sheets/append'
 */
        appendForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: append.url(options),
            method: 'post',
        })
    
    append.form = appendForm
/**
* @see \App\Http\Controllers\GoogleSheetsController::metadata
 * @see app/Http/Controllers/GoogleSheetsController.php:162
 * @route '/api/sheets/metadata'
 */
export const metadata = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: metadata.url(options),
    method: 'post',
})

metadata.definition = {
    methods: ["post"],
    url: '/api/sheets/metadata',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\GoogleSheetsController::metadata
 * @see app/Http/Controllers/GoogleSheetsController.php:162
 * @route '/api/sheets/metadata'
 */
metadata.url = (options?: RouteQueryOptions) => {
    return metadata.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\GoogleSheetsController::metadata
 * @see app/Http/Controllers/GoogleSheetsController.php:162
 * @route '/api/sheets/metadata'
 */
metadata.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: metadata.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\GoogleSheetsController::metadata
 * @see app/Http/Controllers/GoogleSheetsController.php:162
 * @route '/api/sheets/metadata'
 */
    const metadataForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: metadata.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\GoogleSheetsController::metadata
 * @see app/Http/Controllers/GoogleSheetsController.php:162
 * @route '/api/sheets/metadata'
 */
        metadataForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: metadata.url(options),
            method: 'post',
        })
    
    metadata.form = metadataForm
const GoogleSheetsController = { test, read, write, append, metadata }

export default GoogleSheetsController