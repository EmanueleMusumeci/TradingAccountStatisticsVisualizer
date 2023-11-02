### Visualize your deposit account balance and relevant statistics in your browser. 

![Preview image of the web interface](https://github.com/EmanueleMusumeci/TradingAccountStatisticsVisualizer/blob/master/preview.png?raw=true)

Just a very basic and buggy prototype I made to help me compute some statistics from deposit bank accounts for the ISEE indicator.

This utility allows the insertion of *balance data* in two mutually exclusive ways:
* Data can be inserted as cash flows (deposits or withdraws), localized which is translated in the resulting daily balances, updating the balances table below, the balance graph and the desired statistics.
* Alternativley, data can be inserted directly as (sparse) balances, which will overwrite any data inserted in the cash flow table.

The *yearly average balance*, was simply computed as a the average of the daily balance over the days in the current year (taking into account leap years).


To facilitate things I also inserted a parser for eToro and Binance account statements:
* *Binance* allows to download a .txt file with all movements, listed line by line, so it was very easy to actually retrieve cash flow operations and translate them in daily balances
* *eToro* account statements instead have a variable number of pages before the page containing data on the realized equities, so the parser had to first find the correct table and then extrapolate the right data.

Finally, a very basic *balance graph* shows the balance levels throughout the year just to "qualitatively" ensure that the data entered is correct.

Here's a [blog post](https://sites.google.com/view/emanuelemusumeci/blog/account-balance-visualizer) about it, with a live version, on my *personal website*.
