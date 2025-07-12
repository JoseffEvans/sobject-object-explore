# SObject Explore Extension
The SObject explore extension wraps the Salesforce CLI object commands with a GUI. This extension is not affiliated with, endorsed by, or sponsored by Salesforce. All trademarks are the property of their respective owners.

This extension provides a quick look up refrence for your Salesforce organisaion's sobject definitions.

# Features
- A read-only GUI for SObject definitions
- Search features
- Back / forward navigation (mouse 4/5)
- Local caching for speed

# Requirements
- Salesforce CLI (sf) - You can install the SF CLI from this link: [Install SF CLI](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_install_cli.htm)
- One or more [authorized](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_auth_web_flow.htm) CLI [alias](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference_alias_commands_unified.htm)

# How it works
- The extension reads information using the SF CLI's alias and sobject commands.
- The extension saves to results to a SQLITE DB in the extensions directory for instant loading.