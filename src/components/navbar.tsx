            <Item label="Customers" icon={<Users className="mr-2 h-4 w-4" />} href="/customers" />
            <Item label="Add Customer" icon={<UserPlus className="mr-2 h-4 w-4" />} href="/customers/new" />
          </NavigationMenuList>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>Loans</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuList className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              <Item label="All Loans" icon={<CreditCard className="mr-2 h-4 w-4" />} href="/loans" />
              <Item label="New Loan" icon={<Plus className="mr-2 h-4 w-4" />} href="/loans/new" />
              <Item label="Loan Reports" icon={<BarChart className="mr-2 h-4 w-4" />} href="/reports/loans" />
            </NavigationMenuList>
          </NavigationMenuContent>
        </NavigationMenuItem> 