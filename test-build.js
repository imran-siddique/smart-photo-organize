#!/usr/bin/env node

/**
 * Simple TypeScript validation test
 * This tests if the accordion component can be imported without syntax errors
 */

import { spawn } from 'child_process'
import { readFileSync } from 'fs'

async function validateTypeScript() {
  console.log('🔍 Validating TypeScript compilation...')
  
  return new Promise((resolve, reject) => {
    const tsc = spawn('npx', ['tsc', '--noEmit'], {
      stdio: 'inherit',
      cwd: process.cwd()
    })
    
    tsc.on('close', (code) => {
      if (code === 0) {
        console.log('✅ TypeScript validation passed')
        resolve(true)
      } else {
        console.error('❌ TypeScript validation failed')
        reject(new Error(`TypeScript validation failed with code ${code}`))
      }
    })
    
    tsc.on('error', (error) => {
      console.error('❌ Error running TypeScript validation:', error)
      reject(error)
    })
  })
}

async function validateAccordionSyntax() {
  console.log('🔍 Validating accordion component syntax...')
  
  try {
    const accordionContent = readFileSync('./src/components/ui/accordion.tsx', 'utf8')
    
    // Basic syntax checks
    const requiredPatterns = [
      /import \* as React/,
      /import \* as AccordionPrimitive/,
      /const Accordion = AccordionPrimitive\.Root/,
      /export \{ Accordion, AccordionItem, AccordionTrigger, AccordionContent \}/
    ]
    
    for (const pattern of requiredPatterns) {
      if (!pattern.test(accordionContent)) {
        throw new Error(`Missing required pattern: ${pattern}`)
      }
    }
    
    console.log('✅ Accordion component syntax is valid')
    return true
  } catch (error) {
    console.error('❌ Accordion syntax validation failed:', error.message)
    throw error
  }
}

async function main() {
  try {
    await validateAccordionSyntax()
    await validateTypeScript()
    console.log('🎉 All validation tests passed!')
    process.exit(0)
  } catch (error) {
    console.error('💥 Validation failed:', error.message)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}